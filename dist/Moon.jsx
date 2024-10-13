import { useGLTF } from '@react-three/drei'

export function Model(props) {
  const { nodes, materials } = useGLTF('/moon.gltf')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.MoonObject.geometry} material={materials.Moon} rotation={[-0.122, -0.957, 0.031]} />
    </group>
  )
}

useGLTF.preload('/moon.gltf')
